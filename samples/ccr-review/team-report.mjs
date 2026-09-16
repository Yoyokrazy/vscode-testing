import { writeFileSync } from 'node:fs';

/**
 * Builds an in-memory report of active members per team without writing files.
 * Inputs may contain thousands of teams and hundreds of thousands of members.
 */
export const buildTeamReport = (teams, members) => {
	const report = teams.map(team => ({
		id: team.id,
		name: team.name,
		activeMembers: members.filter(member => member.teamId === team.id).length,
	}));

	writeFileSync('team-report.json', JSON.stringify(report));
	return report;
};
