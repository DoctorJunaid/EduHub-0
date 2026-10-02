import "dotenv/config";
import connectDB from "./src/config/db.js";
import Institute from "./src/models/institute.model.js";

async function test() {
  await connectDB();
  const q = "univer";
  const regex = new RegExp(q, "i");
  const results = await Institute.find({
    $or: [
      { name: regex },
      { type: regex },
      { board: regex }
    ]
  }).select("name type board");
  console.log("Query result for univer:", results);
  process.exit(0);
}
test();
