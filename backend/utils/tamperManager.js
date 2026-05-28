let tamperNextPacket = false;

function enableTamperMode() {
  tamperNextPacket = true;
}

function consumeTamperMode() {
  if (!tamperNextPacket) return false;
  tamperNextPacket = false;
  return true;
}

module.exports = { enableTamperMode, consumeTamperMode };
