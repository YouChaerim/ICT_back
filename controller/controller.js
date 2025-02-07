const pool = require('../db');

/**
 * 메인화면
 */
exports.gethome = async (req, res) => {
  console.log("메인페이지");

  // 현재 연도 가져오기
  const currentYear = new Date().getFullYear();
  const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD 형식

  // 1. 전체 연도 기준 총 소비 금액, 신용카드, 체크카드+현금 사용량 조회
  const [yearlyData] = await pool.query(`
    SELECT 
      SUM(price) AS total_spent, 
      SUM(CASE WHEN payment = '신용카드' THEN price ELSE 0 END) AS credit_spent,
      SUM(CASE WHEN payment IN ('체크카드', '현금') THEN price ELSE 0 END) AS check_spent
    FROM data
    WHERE YEAR(date) = ?;
  `, [currentYear]);

  // 2. 현재까지의 소비 금액 조회
  const [currentData] = await pool.query(`
    SELECT 
      SUM(price) AS current_spent
    FROM data
    WHERE YEAR(date) = ? AND date <= ?;
  `, [currentYear, currentDate]);

  // 3. 날짜별 소비 내역 조회 (달력 형태로 사용 가능)
  const [dailyData] = await pool.query(`
    SELECT 
      date, 
      SUM(price) AS daily_total_spent, 
      SUM(CASE WHEN payment = '신용카드' THEN price ELSE 0 END) AS daily_credit_spent,
      SUM(CASE WHEN payment IN ('체크카드', '현금') THEN price ELSE 0 END) AS daily_check_spent
    FROM data
    WHERE YEAR(date) = ?
    GROUP BY date
    ORDER BY date;
  `, [currentYear]);

  // 연봉 6,000 기준 신용카드 소득공제 목표 금액
  const yearly_credit_target = 15000000; // 1,500만 원
  const max_tax_deduction = 3000000; // 최대 소득공제 한도

  // 데이터 가공 (연도별 총 소비 데이터)
  const total_spent = yearlyData[0].total_spent || 0;
  const credit_spent = yearlyData[0].credit_spent || 0;
  const check_spent = yearlyData[0].check_spent || 0; // 체크카드 + 현금 사용 금액
  const current_spent = currentData[0].current_spent || 0; // 현재까지 사용한 총 금액

  // 신용카드 목표 대비 사용량 차이
  const credit_gap = yearly_credit_target - credit_spent;

  // 신용카드 소득공제 계산 (1,500만 원 초과분의 15%)
  const credit_deduction = credit_spent > yearly_credit_target 
    ? (credit_spent - yearly_credit_target) * 0.15 
    : 0;

  // 체크카드(현금 포함) 소득공제 계산 (1,500만 원 초과분의 30%)
  const check_deduction = check_spent > yearly_credit_target 
    ? (check_spent - yearly_credit_target) * 0.3 
    : 0;

  // 최대로 받을 수 있는 소득공제는 300만 원 제한
  const total_deduction = Math.min(credit_deduction + check_deduction, max_tax_deduction);

  console.log({
    total_spent,
    current_spent,
    credit_spent,
    check_spent,
    yearly_credit_target,
    credit_gap,
    credit_deduction,
    check_deduction,
    total_deduction,
    dailyData
  });

  res.send({
    message: 'home',
    data: {
      total_spent,        // 1년 동안 총 사용 금액
      current_spent,      // 해당 연도에서 현재까지 사용한 총 소비 금액
      credit_spent,       // 1년 동안 신용카드 사용 금액
      check_spent,        // 1년 동안 체크카드 + 현금 사용 금액
      yearly_credit_target, // 신용카드 연말정산 목표 사용 금액 (1,500만 원)
      credit_gap,         // 목표 대비 부족한 신용카드 사용 금액
      credit_deduction,   // 신용카드 사용으로 인한 소득공제 예상 금액
      check_deduction,    // 체크카드(현금 포함) 사용으로 인한 소득공제 예상 금액
      total_deduction,    // 최종 소득공제 금액 (최대 300만 원)
      dailyData           // 날짜별 소비 내역 (달력 형태로 사용 가능)
    }
  });
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