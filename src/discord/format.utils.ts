export function formatListCodeBlock(list: string[]) {
    return `\`\`\`\n${list.join('\n')}\`\`\``;
}
