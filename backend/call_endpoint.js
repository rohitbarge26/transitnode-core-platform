async function clear() {
  try {
    const res = await fetch('http://localhost:3000/api/admin/rates/clear', { method: 'DELETE' });
    const text = await res.text();
    console.log(text);
  } catch(e) {
    console.error(e);
  }
}
clear();
