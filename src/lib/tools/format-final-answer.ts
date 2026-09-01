/**
 * Format Final Answer Tool
 *
 * This is the actual implementation of the
 * format_final_answer tool described to the model.
 *
 * Example:
 *
 *   formatFinalAnswer(16254)
 *
 * returns:
 *
 *   "The final answer is 16254."
 */

export function formatFinalAnswer(total: number) {
    /**
     * TypeScript expects total to be a number at compile time.
     *
     * This runtime check protects us if invalid data somehow
     * reaches this function.
     */
    if (typeof total !== "number" || !Number.isFinite(total)) {
        throw new Error(
            `Invalid total: ${total}`
        );
    }

    return `The final answer is ${total}.`;
}