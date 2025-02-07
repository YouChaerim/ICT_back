const express = require('express');
const app = express();
const indexRouter = require('./routes/index');
const cors = require('cors');


app.use(express.json({ extended: true }));
app.use(cors({
  origin: ["http://localhost:3000"],
  method: ["POST", "GET"],
  credentials:true,
}));


app.use('/', indexRouter);

const port = 4000;
app.listen(port, ()=>{
  console.log(port,'번 포트에서 서버 가동중');
})


module.exports = app;
