const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname === "/") {
      return new Response("Laundry Tag Scanner API running");
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server listening on port ${server.port}`);
