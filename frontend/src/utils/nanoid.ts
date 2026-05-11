export const nanoid = (size = 10) =>
  crypto.getRandomValues(new Uint8Array(size)).reduce((id, byte) => {
    return id + (byte & 63).toString(36);
  }, '');
