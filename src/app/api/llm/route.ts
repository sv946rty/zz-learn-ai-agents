/**
 * Lesson 001-005 — Streaming
 *
 * Goal:
 * Stream the model's response from OpenAI through our Next.js
 * Route Handler to the client as the text is generated.
 *
 * Test with curl:
 *
 * curl -N -X POST http://localhost:3000/api/llm \
 *   -H "Content-Type: application/json" \
 *   -d '{"prompt":"Count from 1 to 20 slowly, with each number on a new line."}'
 *
 * The -N flag tells curl not to buffer the response,
 * making it easier to see the streamed text arrive progressively.
 */

import OpenAI from "openai";

// Create the OpenAI client.
//
// The SDK automatically reads OPENAI_API_KEY from the server's
// environment variables. The API key stays on the server and is
// never sent to the browser.
const openai = new OpenAI();

export async function POST(request: Request) {
    // Read the JSON body sent by the client.
    //
    // Example request body:
    //
    // {
    //   "prompt": "Count from 1 to 20 slowly..."
    // }
    //
    // request.json() converts the JSON body into a JavaScript object.
    // Destructuring extracts the "prompt" property from that object.
    const { prompt } = await request.json();

    console.log("Prompt received:", prompt); // Prompt received: Count from 1 to 20 slowly, with each number on a new line.

    // Send the prompt to OpenAI.
    //
    // stream: true is the key difference in this lesson.
    //
    // Without streaming:
    //
    //   await OpenAI
    //       ↓
    //   complete Response object
    //
    // With streaming:
    //
    //   OpenAI
    //       ↓
    //   event
    //       ↓
    //   event
    //       ↓
    //   event
    //
    // modelStream is therefore an async stream of OpenAI events,
    // rather than one completed response object.
    const modelStream = await openai.responses.create({
        model: "gpt-5.6-luna",
        input: prompt,
        stream: true,
    });

    // Create a Web ReadableStream that Next.js can return to the client.
    //
    // Think of this as a pipe:
    //
    // OpenAI modelStream
    //       ↓
    // ReadableStream
    //       ↓
    // HTTP Response
    //       ↓
    // client
    //
    // When a ReadableStream is created, the Streams API calls
    // start(controller) for us.
    //
    // We do NOT manually call start().
    const stream = new ReadableStream({
        async start(controller) {
            // HTTP response streams send bytes, not JavaScript strings.
            //
            // TextEncoder converts strings such as:
            //
            //   "The"
            //   " capital"
            //   " of"
            //
            // into Uint8Array byte data that can be placed
            // into the response stream.
            const encoder = new TextEncoder();

            // OpenAI sends many different event types while generating
            // a response.
            //
            // Examples:
            //
            // response.created
            // response.in_progress
            // response.output_item.added
            // response.content_part.added
            // response.output_text.delta
            // response.output_text.done
            // response.completed
            //
            // "for await" waits for each event as it arrives.
            for await (const event of modelStream) {
                // For this lesson, we only care about text delta events.
                //
                // A delta is a newly generated piece of text.
                //
                // Example:
                //
                // Delta: "The"
                // Delta: " capital"
                // Delta: " of"
                // Delta: " France"
                //
                // A delta is NOT necessarily one word or one token.
                if (event.type === "response.output_text.delta") {
                    // event.delta is currently a JavaScript string.
                    //
                    // encoder.encode(event.delta)
                    // converts that string into bytes.
                    //
                    // controller.enqueue(...)
                    // places those bytes into our ReadableStream so they
                    // can immediately travel toward the client.
                    controller.enqueue(
                        encoder.encode(event.delta)
                    );
                }
            }

            // We reach this point after OpenAI's modelStream has ended.
            //
            // close() tells the client:
            //
            // "There is no more data coming."
            controller.close();
        },
    });

    // Return the ReadableStream as the HTTP response.
    //
    // Unlike previous lessons, we are NOT doing:
    //
    //   return Response.json(...)
    //
    // because we do not want to wait for the complete model response
    // and then return one JSON object.
    //
    // We return the stream immediately so text can reach the client
    // progressively as OpenAI generates it.
    return new Response(stream, {
        headers: {
            // Tell the client that the streamed bytes represent UTF-8 text.
            "Content-Type": "text/plain; charset=utf-8",
        },
    });
}