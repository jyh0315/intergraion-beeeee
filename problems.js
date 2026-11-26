// 문제 은행
// 정적분: ["d", 분류, 문제 LaTeX, 피적분함수, 아래끝, 위끝, 정답(math.js 식), 정답 LaTeX]
// 부정적분: ["i", 분류, 문제 LaTeX, 피적분함수, 원시함수(math.js 식), 원시함수 LaTeX, [채점 구간]]
// 정답은 모두 수치적분/수치미분으로 검증됨 (tools/verify)

const RAW = {
  easy: [
    ["d", "기본", "\\int_0^1 x^3\\,dx", "x^3", "0", "1", "1/4", "\\frac14"],
    ["d", "기본", "\\int_0^1 (2x+1)\\,dx", "2x+1", "0", "1", "2", "2"],
    ["d", "기본", "\\int_1^2 (3x^2-2x)\\,dx", "3x^2-2x", "1", "2", "4", "4"],
    ["d", "기본", "\\int_0^4 \\sqrt{x}\\,dx", "sqrt(x)", "0", "4", "16/3", "\\frac{16}{3}"],
    ["d", "기본", "\\int_1^2 \\left(x^2+\\frac{1}{x^2}\\right)dx", "x^2+1/x^2", "1", "2", "17/6", "\\frac{17}{6}"],
    ["d", "지수·로그", "\\int_1^{e} \\frac{1}{x}\\,dx", "1/x", "1", "e", "1", "1"],
    ["d", "지수·로그", "\\int_0^1 e^x\\,dx", "exp(x)", "0", "1", "e-1", "e-1"],
    ["d", "지수·로그", "\\int_0^{\\ln 2} e^{2x}\\,dx", "exp(2x)", "0", "log(2)", "3/2", "\\frac32"],
    ["d", "지수·로그", "\\int_0^1 2^x\\,dx", "2^x", "0", "1", "1/ln(2)", "\\frac{1}{\\ln 2}"],
    ["d", "삼각함수", "\\int_0^{\\pi} \\sin x\\,dx", "sin(x)", "0", "pi", "2", "2"],
    ["d", "삼각함수", "\\int_0^{\\pi/2} \\cos x\\,dx", "cos(x)", "0", "pi/2", "1", "1"],
    ["d", "삼각함수", "\\int_0^{\\pi/4} \\sec^2 x\\,dx", "sec(x)^2", "0", "pi/4", "1", "1"],
    ["d", "삼각함수", "\\int_0^{\\pi} \\cos^2 x\\,dx", "cos(x)^2", "0", "pi", "pi/2", "\\frac{\\pi}{2}"],
    ["d", "삼각함수", "\\int_0^{\\pi/2} \\sin 2x\\,dx", "sin(2x)", "0", "pi/2", "1", "1"],
    ["d", "역삼각함수", "\\int_0^1 \\frac{1}{1+x^2}\\,dx", "1/(1+x^2)", "0", "1", "pi/4", "\\frac{\\pi}{4}"],
    ["d", "역삼각함수", "\\int_0^{1/2} \\frac{1}{\\sqrt{1-x^2}}\\,dx", "1/sqrt(1-x^2)", "0", "1/2", "pi/6", "\\frac{\\pi}{6}"],
    ["d", "치환", "\\int_0^1 x e^{x^2}\\,dx", "x*exp(x^2)", "0", "1", "(e-1)/2", "\\frac{e-1}{2}"],
    ["d", "절댓값", "\\int_0^2 |x-1|\\,dx", "abs(x-1)", "0", "2", "1", "1"],
    ["d", "대칭", "\\int_{-1}^{1} (x^5+\\sin x)\\,dx", "x^5+sin(x)", "-1", "1", "0", "0"],
    ["d", "이상적분", "\\int_1^{\\infty} \\frac{1}{x^2}\\,dx", "1/x^2", "1", "inf", "1", "1"],
    ["i", "기본", "\\int x^2\\,dx", "x^2", "x^3/3", "\\frac{x^3}{3}", [-2, 2]],
    ["i", "기본", "\\int (4x^3+2x)\\,dx", "4x^3+2x", "x^4+x^2", "x^4+x^2", [-2, 2]],
    ["i", "기본", "\\int \\frac{1}{\\sqrt{x}}\\,dx", "1/sqrt(x)", "2sqrt(x)", "2\\sqrt{x}", [0.5, 4]],
    ["i", "삼각함수", "\\int \\cos x\\,dx", "cos(x)", "sin(x)", "\\sin x", [-2, 2]],
    ["i", "삼각함수", "\\int \\sec^2 x\\,dx", "sec(x)^2", "tan(x)", "\\tan x", [-1, 1]],
    ["i", "지수·로그", "\\int e^{3x}\\,dx", "exp(3x)", "exp(3x)/3", "\\frac{e^{3x}}{3}", [-1, 1]],
    ["i", "지수·로그", "\\int \\frac{1}{x}\\,dx\\quad(x>0)", "1/x", "log(x)", "\\ln x", [0.5, 4]],
  ],
  normal: [
    ["d", "부분적분", "\\int_0^1 x e^x\\,dx", "x*exp(x)", "0", "1", "1", "1"],
    ["d", "부분적분", "\\int_1^{e} \\ln x\\,dx", "log(x)", "1", "e", "1", "1"],
    ["d", "부분적분", "\\int_0^{\\pi/2} x\\sin x\\,dx", "x*sin(x)", "0", "pi/2", "1", "1"],
    ["d", "부분적분", "\\int_0^{\\pi} x\\cos x\\,dx", "x*cos(x)", "0", "pi", "-2", "-2"],
    ["d", "부분적분", "\\int_1^{e} (\\ln x)^2\\,dx", "log(x)^2", "1", "e", "e-2", "e-2"],
    ["d", "부분적분", "\\int_0^1 x^2 e^x\\,dx", "x^2*exp(x)", "0", "1", "e-2", "e-2"],
    ["d", "부분적분", "\\int_0^1 \\arctan x\\,dx", "atan(x)", "0", "1", "pi/4 - ln(2)/2", "\\frac{\\pi}{4}-\\frac{\\ln 2}{2}"],
    ["d", "부분적분", "\\int_0^1 x\\arctan x\\,dx", "x*atan(x)", "0", "1", "pi/4 - 1/2", "\\frac{\\pi}{4}-\\frac12"],
    ["d", "부분적분", "\\int_0^1 x\\ln x\\,dx", "x*log(x)", "0", "1", "-1/4", "-\\frac14"],
    ["d", "부분적분", "\\int_0^{\\pi/2} e^x\\cos x\\,dx", "exp(x)*cos(x)", "0", "pi/2", "(e^(pi/2)-1)/2", "\\frac{e^{\\pi/2}-1}{2}"],
    ["d", "치환", "\\int_0^1 \\frac{x}{1+x^2}\\,dx", "x/(1+x^2)", "0", "1", "ln(2)/2", "\\frac{\\ln 2}{2}"],
    ["d", "치환", "\\int_0^1 x\\sqrt{1+x^2}\\,dx", "x*sqrt(1+x^2)", "0", "1", "(2sqrt(2)-1)/3", "\\frac{2\\sqrt2-1}{3}"],
    ["d", "치환", "\\int_1^2 \\frac{2x+3}{x^2+3x}\\,dx", "(2x+3)/(x^2+3x)", "1", "2", "ln(5/2)", "\\ln\\frac52"],
    ["d", "치환", "\\int_0^{\\pi/2} \\frac{\\sin x}{(1+\\cos x)^2}\\,dx", "sin(x)/(1+cos(x))^2", "0", "pi/2", "1/2", "\\frac12"],
    ["d", "삼각함수", "\\int_0^{\\pi/2} \\sin^3 x\\,dx", "sin(x)^3", "0", "pi/2", "2/3", "\\frac23"],
    ["d", "삼각함수", "\\int_0^{\\pi/2} \\sin^2 x\\cos x\\,dx", "sin(x)^2*cos(x)", "0", "pi/2", "1/3", "\\frac13"],
    ["d", "삼각함수", "\\int_0^{\\pi/3} \\tan x\\,dx", "tan(x)", "0", "pi/3", "ln(2)", "\\ln 2"],
    ["d", "부분분수", "\\int_0^1 \\frac{1}{x^2+3x+2}\\,dx", "1/(x^2+3x+2)", "0", "1", "ln(4/3)", "\\ln\\frac43"],
    ["d", "부분분수", "\\int_2^3 \\frac{1}{x^2-1}\\,dx", "1/(x^2-1)", "2", "3", "ln(3/2)/2", "\\frac12\\ln\\frac32"],
    ["d", "삼각치환", "\\int_0^1 \\sqrt{1-x^2}\\,dx", "sqrt(1-x^2)", "0", "1", "pi/4", "\\frac{\\pi}{4}"],
    ["d", "이상적분", "\\int_0^{\\infty} e^{-x}\\sin x\\,dx", "exp(-x)*sin(x)", "0", "inf", "1/2", "\\frac12"],
    ["d", "이상적분", "\\int_0^{\\infty} x e^{-x}\\,dx", "x*exp(-x)", "0", "inf", "1", "1"],
    ["d", "이상적분", "\\int_1^{\\infty} \\frac{1}{x(x+1)}\\,dx", "1/(x*(x+1))", "1", "inf", "ln(2)", "\\ln 2"],
    ["i", "부분적분", "\\int x e^x\\,dx", "x*exp(x)", "(x-1)exp(x)", "(x-1)e^x", [-2, 2]],
    ["i", "부분적분", "\\int \\ln x\\,dx", "log(x)", "x*log(x)-x", "x\\ln x - x", [0.5, 4]],
    ["i", "부분적분", "\\int x\\cos x\\,dx", "x*cos(x)", "x*sin(x)+cos(x)", "x\\sin x+\\cos x", [-2, 2]],
    ["i", "치환", "\\int 2x\\cos(x^2)\\,dx", "2x*cos(x^2)", "sin(x^2)", "\\sin(x^2)", [-1.5, 1.5]],
    ["i", "치환", "\\int \\frac{x}{x^2+1}\\,dx", "x/(x^2+1)", "log(x^2+1)/2", "\\frac12\\ln(x^2+1)", [-2, 2]],
    ["i", "삼각함수", "\\int \\tan x\\,dx\\quad(|x|<\\tfrac{\\pi}{2})", "tan(x)", "-log(cos(x))", "-\\ln(\\cos x)", [-1, 1]],
    ["i", "부분분수", "\\int \\frac{1}{x^2-1}\\,dx\\quad(x>1)", "1/(x^2-1)", "log((x-1)/(x+1))/2", "\\frac12\\ln\\frac{x-1}{x+1}", [1.5, 4]],
  ],
  hard: [
    ["d", "대칭", "\\int_0^{\\pi/2} \\frac{\\sin x}{\\sin x+\\cos x}\\,dx", "sin(x)/(sin(x)+cos(x))", "0", "pi/2", "pi/4", "\\frac{\\pi}{4}"],
    ["d", "대칭", "\\int_0^{\\pi/2} \\frac{1}{1+\\tan^{\\sqrt2} x}\\,dx", "1/(1+tan(x)^sqrt(2))", "0", "pi/2", "pi/4", "\\frac{\\pi}{4}"],
    ["d", "대칭", "\\int_{-1}^{1} \\frac{1}{(1+e^x)(1+x^2)}\\,dx", "1/((1+exp(x))*(1+x^2))", "-1", "1", "pi/4", "\\frac{\\pi}{4}"],
    ["d", "대칭", "\\int_0^{\\pi} \\frac{x\\sin x}{1+\\cos^2 x}\\,dx", "x*sin(x)/(1+cos(x)^2)", "0", "pi", "pi^2/4", "\\frac{\\pi^2}{4}"],
    ["d", "대칭", "\\int_0^{\\pi} \\frac{x}{1+\\sin x}\\,dx", "x/(1+sin(x))", "0", "pi", "pi", "\\pi"],
    ["d", "대칭", "\\int_0^{\\pi/4} \\ln(1+\\tan x)\\,dx", "log(1+tan(x))", "0", "pi/4", "pi*ln(2)/8", "\\frac{\\pi\\ln 2}{8}"],
    ["d", "대칭", "\\int_0^1 \\frac{\\ln(1+x)}{1+x^2}\\,dx", "log(1+x)/(1+x^2)", "0", "1", "pi*ln(2)/8", "\\frac{\\pi\\ln 2}{8}"],
    ["d", "대칭", "\\int_0^{\\infty} \\frac{\\ln x}{1+x^2}\\,dx", "log(x)/(1+x^2)", "0", "inf", "0", "0"],
    ["d", "급수", "\\int_0^{\\infty} \\frac{x}{e^x-1}\\,dx", "x/(exp(x)-1)", "0", "inf", "pi^2/6", "\\frac{\\pi^2}{6}"],
    ["d", "급수", "\\int_0^{\\infty} \\frac{x^3}{e^x-1}\\,dx", "x^3/(exp(x)-1)", "0", "inf", "pi^4/15", "\\frac{\\pi^4}{15}"],
    ["d", "급수", "\\int_0^1 \\frac{\\ln x}{1-x}\\,dx", "log(x)/(1-x)", "0", "1", "-pi^2/6", "-\\frac{\\pi^2}{6}"],
    ["d", "급수", "\\int_0^1 \\frac{\\ln(1+x)}{x}\\,dx", "log(1+x)/x", "0", "1", "pi^2/12", "\\frac{\\pi^2}{12}"],
    ["d", "급수", "\\int_0^1 \\ln x\\,\\ln(1-x)\\,dx", "log(x)*log(1-x)", "0", "1", "2 - pi^2/6", "2-\\frac{\\pi^2}{6}"],
    ["d", "특수", "\\int_0^{\\pi/2} \\ln(\\sin x)\\,dx", "log(sin(x))", "0", "pi/2", "-pi*ln(2)/2", "-\\frac{\\pi\\ln 2}{2}"],
    ["d", "특수", "\\int_0^{\\pi/2} \\frac{x}{\\tan x}\\,dx", "x/tan(x)", "0", "pi/2", "pi*ln(2)/2", "\\frac{\\pi\\ln 2}{2}"],
    ["d", "특수", "\\int_0^{\\infty} e^{-x^2}\\,dx", "exp(-x^2)", "0", "inf", "sqrt(pi)/2", "\\frac{\\sqrt{\\pi}}{2}"],
    ["d", "특수", "\\int_0^1 \\frac{x-1}{\\ln x}\\,dx", "(x-1)/log(x)", "0", "1", "ln(2)", "\\ln 2"],
    ["d", "유리함수", "\\int_0^1 \\frac{x^4(1-x)^4}{1+x^2}\\,dx", "x^4*(1-x)^4/(1+x^2)", "0", "1", "22/7 - pi", "\\frac{22}{7}-\\pi"],
    ["d", "유리함수", "\\int_0^{\\infty} \\frac{1}{1+x^4}\\,dx", "1/(1+x^4)", "0", "inf", "pi/(2sqrt(2))", "\\frac{\\pi}{2\\sqrt2}"],
    ["d", "삼각함수", "\\int_0^{\\pi/2} \\sqrt{\\tan x}\\,dx", "sqrt(tan(x))", "0", "pi/2", "pi/sqrt(2)", "\\frac{\\pi}{\\sqrt2}"],
    ["d", "삼각함수", "\\int_0^{2\\pi} \\frac{1}{2+\\cos x}\\,dx", "1/(2+cos(x))", "0", "2pi", "2pi/sqrt(3)", "\\frac{2\\pi}{\\sqrt3}"],
    ["i", "삼각함수", "\\int \\sec x\\,dx\\quad(|x|<\\tfrac{\\pi}{2})", "sec(x)", "log(sec(x)+tan(x))", "\\ln(\\sec x+\\tan x)", [-1.2, 1.2]],
    ["i", "부분적분", "\\int e^x\\sin x\\,dx", "exp(x)*sin(x)", "exp(x)(sin(x)-cos(x))/2", "\\frac{e^x(\\sin x-\\cos x)}{2}", [-2, 2]],
    ["i", "삼각치환", "\\int \\sqrt{1-x^2}\\,dx", "sqrt(1-x^2)", "(x*sqrt(1-x^2)+asin(x))/2", "\\frac{x\\sqrt{1-x^2}+\\arcsin x}{2}", [-0.9, 0.9]],
    ["i", "치환", "\\int \\frac{1}{1+e^x}\\,dx", "1/(1+exp(x))", "x-log(1+exp(x))", "x-\\ln(1+e^x)", [-2, 2]],
  ],
};

function build(d, row, i) {
  if (row[0] === "d") {
    const [, cat, tex, f, a, b, ans, ansTex] = row;
    return { id: `${d}:${i}`, diff: d, type: "d", cat, tex, f, a, b, ans, ansTex };
  }
  const [, cat, tex, f, ans, ansTex, dom] = row;
  return { id: `${d}:${i}`, diff: d, type: "i", cat, tex, f, ans, ansTex: `${ansTex}+C`, dom };
}

export const PROBLEMS = Object.fromEntries(
  Object.entries(RAW).map(([d, rows]) => [d, rows.map((r, i) => build(d, r, i))])
);
export const getProblem = (id) => { const [d, i] = String(id).split(":"); return PROBLEMS[d]?.[Number(i)]; };

export const DIFFICULTY_LABEL = { easy: "쉬움", normal: "보통", hard: "어려움", mixed: "섞어서" };
export const DEFAULT_TIME = { easy: 60, normal: 120, hard: 180, mixed: 120 };
