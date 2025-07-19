import app from "./app";

const PORT = process.env.PORT || "3000"; // default to string
const HOST = "0.0.0.0";

app.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
});
