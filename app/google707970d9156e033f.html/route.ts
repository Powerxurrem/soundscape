export async function GET() {
  return new Response(
    "google-site-verification: google707970d9156e033f.html",
    {
      headers: {
        "Content-Type": "text/plain",
      },
    }
  );
}
