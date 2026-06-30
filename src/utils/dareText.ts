export function convertDareToCompletionText(dareTitle: string): string {
  if (!dareTitle) return "";

  let text = dareTitle.trim();

  const verbMap: Record<string, string> = {
    Ask: "I asked",
    Thank: "I thanked",
    Say: "I said",
    Share: "I shared",
    Give: "I gave",
    Offer: "I offered",
    Invite: "I invited",
    Speak: "I spoke",
    Tell: "I told",
    Help: "I helped",
    Greet: "I greeted",
    Join: "I joined",
    Introduce: "I introduced",
    Start: "I started",
    Encourage: "I encouraged",
    Respond: "I responded",
    Wish: "I wished",
    Volunteer: "I volunteered",
    Compliment: "I complimented",
    Appreciate: "I appreciated",
    Answer: "I answered",
    Check: "I checked",
    Congratulate: "I congratulated",
  };

  const firstWord = text.split(" ")[0];
  const replacement = verbMap[firstWord];

  if (replacement) {
    text = text.replace(new RegExp(`^${firstWord}\\b`, "i"), replacement);
  } else {
    text = `I completed: ${text}`;
  }

  text = text
    .replace(/\byourself\b/gi, "myself")
    .replace(/\byour\b/gi, "my")
    .replace(/\byours\b/gi, "mine")
    .replace(/\byou\b/gi, "I");

  return text;
}
