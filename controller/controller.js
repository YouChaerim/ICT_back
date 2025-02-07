const pool = require('../db');

/**
 * 메인화면
 */
exports.gethome = async (req, res) => {
  console.log("메인페이지");

  const [data] = await pool.query(
    "select * from data"
  );
  
  console.log(data);

  res.send({
    message: 'home',
    data: data
  })
};


/**
 * 가계부 추가
 */
exports.postfinancial = async (req, res) => {
  const { payment, price } = req.body;
  console.log(payment, price);

  const addFinancial = await pool.query(
    "insert into data (payment, price, date) values (?, ?, now())",
    [payment, price]
  );

  return res.send("등록 완료");
}