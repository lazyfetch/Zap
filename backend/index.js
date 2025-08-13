import dotenv from "dotenv";
dotenv.config();

import { app } from "./app.js";
import connectdb from "./src/db/connectdb.js";

const port = process.env.PORT || 8000;

connectdb()
  .then(() => {
    app.listen(port, () => {
      console.log(`SERVER IS LISTENING ON ${port}`);
    });
  })
  .catch((err) => {
    console.log("Error connecting to db: ", err);
  });

