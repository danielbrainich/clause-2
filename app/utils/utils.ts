export const cleanActionString = (string) => {
  const twoStrings = string.split("(");
  const secondString = twoStrings[0];
  return secondString;
};
