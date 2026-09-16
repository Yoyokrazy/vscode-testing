/**
 * Builds an in-memory report of active members per team without writing files.
 * Inputs may contain thousands of teams and hundreds of thousands of members.
 */
export const buildTeamReport = (teams, members) => {
	const activeCounts = new Map();
	for (const member of members) {
		if (member.active) {
			activeCounts.set(member.teamId, (activeCounts.get(member.teamId) ?? 0) + 1);
		}
	}

	return teams.map(team => ({
		id: team.id,
		name: team.name,
		activeMembers: activeCounts.get(team.id) ?? 0,
	}));
};
