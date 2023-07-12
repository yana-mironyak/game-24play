export function getRandomColor() {
  const colors = [0x0000ff, 0xffa500, 0x800080];
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
}
