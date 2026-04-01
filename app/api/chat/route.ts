import { google } from '@ai-sdk/google';
import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai';
import type { UIMessage } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Server-side Supabase client using the anon key.
// Queries run through execute_readonly_sql(), a SECURITY DEFINER function
// that enforces SELECT-only access at the database level.
const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// 60s allows for Gemini tool-call → SQL → final answer on Vercel Pro.
// If on Hobby plan, reduce to 10 and expect timeouts on slow queries.
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    console.error('[chat] Failed to parse request body:', e);
    return new Response('Bad request', { status: 400 });
  }

  const uiMessages: UIMessage[] = body.messages ?? [];
  console.log('[chat] Received', uiMessages.length, 'UI messages');

  let modelMessages;
  try {
    modelMessages = await convertToModelMessages(uiMessages);
  } catch (e) {
    console.error('[chat] convertToModelMessages failed:', e);
    return new Response('Message conversion error', { status: 500 });
  }

  // Filter out messages with empty content to avoid Gemini errors
  const filteredMessages = modelMessages.filter((m) =>
    Array.isArray(m.content) ? m.content.length > 0 : Boolean(m.content)
  );

  console.log('[chat] Sending', filteredMessages.length, 'model messages to Gemini');

  try {
    const result = streamText({
      model: google('gemini-2.5-flash'),
      // stopWhen replaces maxSteps in this SDK version. Default is stepCountIs(1)
      // which stops after the tool executes and never generates the final answer.
      stopWhen: stepCountIs(5),
      system: `You are Luminous, a specialized precision analytics database agent for Forklift Parts Supply configured inside an executive dashboard. 
      Your strict objective is answering specific user questions by retrieving data from actual SQL queries using your query_database tool.
      You have direct read-only access to two PostgreSQL tables:
      
      1. sales  (many rows per day — one row per individual transaction)
         - date (date)
         - amount (numeric): gross sale amount in dollars
         - cost_of_goods (numeric)
         - net_sales (numeric)
         - commission_paid (numeric)
         - sales_rep (text)
         - customer (text)
         - channel (text)

      2. marketing_metrics  (exactly ONE row per day — daily totals)
         - date (date)
         - google_ppc_clicks (integer)
         - organic_visits (integer)
         - incoming_calls (integer)
         - ad_spend (numeric): total ad spend in dollars for that day

      ⚠️  CRITICAL QUERY RULE — READ CAREFULLY:
      The two tables have different cardinalities. "sales" has MULTIPLE rows per date;
      "marketing_metrics" has exactly ONE row per date.
      NEVER write a direct JOIN between these two tables for aggregate queries.
      A direct JOIN will multiply the marketing_metrics values (like ad_spend) by the
      number of sales rows for each date, producing COMPLETELY WRONG inflated numbers.

      Instead, ALWAYS use one of these safe patterns:
        a) Separate independent queries (call query_database twice, once per table)
        b) A CTE that pre-aggregates each table before joining:
           WITH daily_sales AS (
             SELECT date, SUM(amount) AS revenue FROM sales
             WHERE date >= CURRENT_DATE - INTERVAL '3 days' GROUP BY date
           ),
           daily_spend AS (
             SELECT date, SUM(ad_spend) AS ad_spend FROM marketing_metrics
             WHERE date >= CURRENT_DATE - INTERVAL '3 days' GROUP BY date
           )
           SELECT SUM(revenue), SUM(ad_spend)
           FROM daily_sales ds JOIN daily_spend dm ON ds.date = dm.date
        c) Scalar subqueries:
           SELECT
             (SELECT SUM(ad_spend) FROM marketing_metrics WHERE date >= CURRENT_DATE - INTERVAL '3 days') AS total_ad_spend,
             (SELECT SUM(amount)   FROM sales             WHERE date >= CURRENT_DATE - INTERVAL '3 days') AS total_revenue

      Always call query_database before answering any factual question.
      Return your final answer formatted cleanly and accurately based on the tool output only.
      Use dollar signs ($) and comma-separators (e.g. $1,234.56) for all currency values. NEVER invent or approximate numbers.`,
      messages: filteredMessages,
      tools: {
        query_database: tool({
          description:
            'Execute a read-only SELECT query against the analytics database. Returns a JSON array of result rows.',
          parameters: z.object({
            query: z
              .string()
              .describe('A valid PostgreSQL SELECT statement to execute.'),
          }),
          // @ts-expect-error: Zod v4 generics don't satisfy the tool() execute overload constraint
          execute: async (args: { query: string }) => {
            console.log('[chat] Tool called with args:', JSON.stringify(args));
            const query = args.query;

            if (!query) {
              console.error('[chat] query parameter was empty/undefined');
              return 'ERROR: No SQL query was provided.';
            }

            console.log('[chat] Executing SQL:', query);

            const upperQuery = query.toUpperCase().trim();
            if (
              !upperQuery.startsWith('SELECT') ||
              upperQuery.includes('DROP') ||
              upperQuery.includes('DELETE') ||
              upperQuery.includes('UPDATE') ||
              upperQuery.includes('INSERT') ||
              upperQuery.includes('TRUNCATE') ||
              upperQuery.includes('ALTER')
            ) {
              return 'ERROR: Only SELECT queries are permitted.';
            }

            const supabase = getSupabase();
            const { data, error } = await supabase.rpc('execute_readonly_sql', {
              // Strip trailing semicolon — it breaks the wrapper: SELECT json_agg(t) FROM (...;) t
              sql_query: query.trimEnd().replace(/;+$/, ''),
            });

            if (error) {
              console.error('[chat] Supabase RPC error:', error.message);
              return `ERROR: ${error.message}`;
            }

            console.log(
              '[chat] SQL returned',
              Array.isArray(data) ? data.length : 1,
              'rows'
            );
            return JSON.stringify(data);
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (e) {
    console.error('[chat] streamText error:', e);
    return new Response('AI error', { status: 500 });
  }
}
