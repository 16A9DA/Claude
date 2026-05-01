async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const toolArgs = JSON.parse(Buffer.concat(chunks).toString());

  // readPath is the path to the file that Claude is trying to read
  const readPath =
    toolArgs.tool_input?.file_path || toolArgs.tool_input?.path || "";

  const command = toolArgs.tool_input?.command || "";

  if (readPath.includes(".env") || command.includes(".env")) {
    console.error("You can not read .env file");
    process.exit(2);
  }
}

main();
