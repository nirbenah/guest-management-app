module.exports = async () => {
  // Give Jest a moment to clean up
  await new Promise(resolve => setTimeout(resolve, 1000));
};