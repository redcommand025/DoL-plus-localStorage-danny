/* Danny location schedule.
 * Weekday: room 7-8, school 8-15, courtyard 15:00-15:20, work 15:20-20, room 20-21, sleep 21-7
 * Weekend: room 7-9, work 9-16, room 16-21, sleep 21-7
 *
 * Location is time-based even before the player has met Danny.
 * The bedroom door is the meeting path, so gating on init hid every timetable note
 * and threw if C.npc was not ready yet.
 */
function getDannyLocation() {
	if (typeof Time === "undefined" || Time == null || typeof Time.hour !== "number") return "unknown";
	const h = Time.hour;
	const m = typeof Time.minute === "number" ? Time.minute : 0;
	const school = !!Time.schoolDay;

	if (h < 7 || h >= 21) return "sleep";

	if (school) {
		if (h === 7 && m < 30) return "room"; // wake, possible bedwet
		if (h === 7 && m >= 30) return "room";
		if (h === 8 && m < 45) return "walk"; // walking to school / library
		if (h === 8 && m >= 45) return "school";
		if (h >= 9 && h < 12) return "school";
		if (h === 12) return "canteen";
		if (h > 12 && h < 15) return "school";
		if (h === 15 && m < 20) return "courtyard";
		if (h === 15 && m >= 20) return "work";
		if (h > 15 && h < 20) return "work";
		if (h >= 20 && h < 21) return "room";
	} else {
		// Weekend
		if (h >= 7 && h < 9) return "room";
		if (h >= 9 && h < 16) return "work";
		if (h >= 16 && h < 21) return "room";
	}
	return "room";
}
window.getDannyLocation = getDannyLocation;
