export function isValidCPF(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, "")
  if (cleanCpf.length !== 11 || /^(\d)\1+$/.test(cleanCpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCpf.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCpf.charAt(10))) return false

  return true
}

export function formatCPF(cpf: string): string {
  const cleanCpf = cpf.replace(/\D/g, "")
  if (cleanCpf.length !== 11) return cpf
  return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}
