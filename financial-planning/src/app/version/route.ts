import pkg from "../../../package.json";

// The version of the deployment currently live. A copy of the app left open
// on a phone compares this with the version it was built with, to notice a
// newer release and reload itself (see UpdateChecker). Only this number goes
// out; nothing about the user's data. Dynamic by default, and marked
// no-store so neither the CDN nor the browser hands back an old answer.
export function GET() {
  return Response.json({ version: pkg.version }, { headers: { "Cache-Control": "no-store" } });
}
