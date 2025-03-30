const tasks = []; // Здесь будут актуальные задачи

async function handleRequest(request) {
  return new Response(JSON.stringify(tasks), {
    headers: { 'Content-Type': 'application/json' }
  });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
