module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.json({ hasKey: true });
};
