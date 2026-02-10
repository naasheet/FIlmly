const base = "http://localhost:4000/api/v1"

const email = `test${Date.now()}@ex.com`
const password = "TestPass123!"
const name = "Test User"

async function post(path, body) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  let data = {}
  try {
    data = await res.json()
  } catch (err) {
    data = {}
  }
  return { status: res.status, data }
}

async function run() {
  const register = await post("/auth/register", { email, password, name })
  console.log("register", register)

  const login = await post("/auth/login", { email, password })
  console.log("login", login)

  const refreshToken = login.data?.tokens?.refreshToken
  const refresh = await post("/auth/refresh", { refreshToken })
  console.log("refresh", refresh)

  const logout = await post("/auth/logout", { refreshToken })
  console.log("logout", logout)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
