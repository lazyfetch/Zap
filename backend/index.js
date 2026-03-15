import dotenv from "dotenv";
dotenv.config();

import { app,server } from "./app.js";
import connectdb from "./src/db/connectdb.js";

const port = process.env.PORT || 8000;

connectdb()
  .then(() => {
    server.listen(port, () => {
      console.log(`server running at port: ${port}`);
    });
  })
  .catch((err) => {
    console.log("Error connecting to db: ", err);
  });