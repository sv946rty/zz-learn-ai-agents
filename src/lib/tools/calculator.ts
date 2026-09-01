/**
 * Calculator Tool
 *
 * This is the actual implementation of the calculator tool.
 *
 * In Lesson 002-002, we only DESCRIBED the calculator to the model.
 *
 * Now our application has real code that can execute the
 * operation requested by the model.
 */

export type CalculatorOperation =
    | "add"
    | "subtract"
    | "multiply"
    | "divide";

export function calculator(
    operation: CalculatorOperation,
    a: number,
    b: number,
) {
    switch (operation) {
        case "add":
            return a + b;

        case "subtract":
            return a - b;

        case "multiply":
            return a * b;

        case "divide":
            if (b === 0) {
                throw new Error("Cannot divide by zero.");
            }

            return a / b;

        default: {
            /**
             * TypeScript should prevent us from reaching this case because
             * CalculatorOperation allows only the four operations above.
             *
             * Keeping this error also gives us runtime protection if invalid
             * data somehow reaches this function.
             */
            throw new Error(
                `Unsupported calculator operation: ${operation}`
            );
        }
    }
}