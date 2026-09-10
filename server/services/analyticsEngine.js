const { getState } = require('./db');

function calculateAnalytics(filterDistrict = null, filterConstituency = null, sessionFilter = 'ACTIVE') {
  const state = getState();
  const config = state.electionConfig || {};
  const currentSessionId = config.sessionId;
  const currentElectionDate = config.electionDate;
  const isHistoricalArchive = sessionFilter === 'ALL';

  // 1. Strictly filter votes based on the election time window / session
  const windowVotes = (state.votesAudit || []).filter(v => {
    if (isHistoricalArchive) return true;
    if (currentSessionId) {
      return v.sessionId === currentSessionId;
    }
    if (currentElectionDate && v.timestamp) {
      const vDate = new Date(v.timestamp).toISOString().split('T')[0];
      return vDate === currentElectionDate;
    }
    return false;
  });


  // Map candidateId -> count of votes in this election window
  const candidateVoteCounts = {};
  windowVotes.forEach(v => {
    if (v.candidateId) {
      candidateVoteCounts[v.candidateId] = (candidateVoteCounts[v.candidateId] || 0) + 1;
    }
  });

  // Candidates with dynamic vote count for this window
  const candidates = (state.candidates || []).map(c => ({
    ...c,
    votes: isHistoricalArchive ? (c.votes || 0) : (candidateVoteCounts[c.id] || 0)
  }));

  const voters = state.voters || [];
  const parties = state.parties || [];

  // Filter candidates if requested
  let filteredCandidates = candidates;
  if (filterDistrict && filterDistrict !== 'ALL') {
    filteredCandidates = filteredCandidates.filter(c => c.district === filterDistrict);
  }
  if (filterConstituency && filterConstituency !== 'ALL') {
    filteredCandidates = filteredCandidates.filter(c => c.constituency === filterConstituency);
  }

  // Voter turnout metrics for this window
  let relevantVoters = voters;
  if (filterDistrict && filterDistrict !== 'ALL') {
    relevantVoters = relevantVoters.filter(v => v.district === filterDistrict);
  }
  if (filterConstituency && filterConstituency !== 'ALL') {
    relevantVoters = relevantVoters.filter(v => v.constituency === filterConstituency);
  }

  const totalRegisteredVoters = relevantVoters.length;
  const totalVotesCast = relevantVoters.filter(v => {
    if (isHistoricalArchive) return v.hasVoted;
    return windowVotes.some(w => w.voterId === v.id) || (v.lastVotedSessionId === currentSessionId);
  }).length;

  const turnoutPercentage = totalRegisteredVoters > 0 
    ? Number(((totalVotesCast / totalRegisteredVoters) * 100).toFixed(2)) 
    : 0;

  // Group candidates by constituency to determine First-Past-The-Post seat winners
  const constituencyMap = {};
  candidates.forEach(c => {
    if (!constituencyMap[c.constituency]) {
      constituencyMap[c.constituency] = {
        constituency: c.constituency,
        district: c.district,
        candidates: []
      };
    }
    constituencyMap[c.constituency].candidates.push(c);
  });

  const partySeatsWon = {};
  const partyVotesTotal = {};
  const partyMetadata = {};

  parties.forEach(p => {
    partySeatsWon[p.partyName] = 0;
    partyVotesTotal[p.partyName] = 0;
    partyMetadata[p.partyName] = p;
  });

  // Track votes polled in this window
  let overallVotesPolled = windowVotes.length;
  candidates.forEach(c => {
    partyVotesTotal[c.party] = (partyVotesTotal[c.party] || 0) + (c.votes || 0);
  });


  const constituencyWinners = [];

  Object.values(constituencyMap).forEach(con => {
    // Sort candidates in this constituency by votes descending
    const sorted = [...con.candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    const topCandidate = sorted[0];
    const runnerUp = sorted[1] || null;
    const margin = topCandidate ? (topCandidate.votes || 0) - (runnerUp ? runnerUp.votes || 0 : 0) : 0;
    const totalConVotes = sorted.reduce((sum, c) => sum + (c.votes || 0), 0);

    const hasVotes = topCandidate && topCandidate.votes > 0;
    const winnerParty = hasVotes ? topCandidate.party : null;

    if (winnerParty) {
      partySeatsWon[winnerParty] = (partySeatsWon[winnerParty] || 0) + 1;
    }

    constituencyWinners.push({
      constituency: con.constituency,
      district: con.district,
      winner: hasVotes ? topCandidate.name : 'Polls in Progress',
      winnerParty: winnerParty || 'Awaiting Result',
      winnerSymbol: hasVotes ? topCandidate.symbolUrl : '',
      winnerVotes: hasVotes ? topCandidate.votes : 0,
      margin: hasVotes ? margin : 0,
      totalVotes: totalConVotes,
      candidatesCount: con.candidates.length
    });
  });

  // Calculate Seat Share Leaderboard in strictly DESCENDING order of seats won
  const seatLeaderboard = Object.keys(partyVotesTotal).map(partyName => {
    const seats = partySeatsWon[partyName] || 0;
    const votes = partyVotesTotal[partyName] || 0;
    const meta = partyMetadata[partyName] || {};
    const voteShare = overallVotesPolled > 0 ? Number(((votes / overallVotesPolled) * 100).toFixed(1)) : 0;

    return {
      partyName,
      symbolUrl: meta.symbolUrl || '',
      themeColor: meta.themeColor || '#06b6d4',
      seatsWon: seats,
      totalVotes: votes,
      voteSharePercentage: voteShare
    };
  }).sort((a, b) => {
    // Strict descending order of seats won, then total votes
    if (b.seatsWon !== a.seatsWon) {
      return b.seatsWon - a.seatsWon;
    }
    return b.totalVotes - a.totalVotes;
  });

  // Statewide Winner Determination Engine
  const totalConstituencies = Object.keys(constituencyMap).length; // 234 in Tamil Nadu
  const majorityThreshold = Math.floor(totalConstituencies / 2) + 1; // 118 for 234

  const topParty = seatLeaderboard[0] || null;
  let grandWinner = null;

  if (topParty && topParty.seatsWon > 0) {
    const isMajority = topParty.seatsWon >= majorityThreshold;
    grandWinner = {
      partyName: topParty.partyName,
      symbolUrl: topParty.symbolUrl,
      themeColor: topParty.themeColor,
      seatsWon: topParty.seatsWon,
      totalSeats: totalConstituencies,
      majorityThreshold,
      isMajority,
      declaration: isMajority
        ? `${topParty.partyName}: ${topParty.seatsWon} Seats Won - Absolute Majority Formed`
        : `${topParty.partyName}: Leading with ${topParty.seatsWon} Seats (${topParty.voteSharePercentage}% Vote Share)`
    };
  } else {
    grandWinner = {
      partyName: 'Election in Progress',
      symbolUrl: '',
      themeColor: '#06b6d4',
      seatsWon: 0,
      totalSeats: totalConstituencies,
      majorityThreshold,
      isMajority: false,
      declaration: 'Polls Currently Active - Live Tabulation Underway'
    };
  }

  // Filtered candidate breakdown for charts
  const candidateChartData = filteredCandidates
    .filter(c => (c.votes || 0) > 0 || filteredCandidates.length <= 15)
    .slice(0, 15)
    .map(c => ({
      name: c.name,
      party: c.party,
      votes: c.votes || 0,
      symbolUrl: c.symbolUrl,
      themeColor: c.themeColor || '#06b6d4'
    }));

  return {
    turnout: {
      totalRegisteredVoters,
      totalVotesCast,
      turnoutPercentage,
      overallVotesPolled,
      totalConstituencies
    },
    activeWindow: {
      sessionId: currentSessionId,
      electionDate: config.electionDate,
      startTime: config.startTime,
      endTime: config.endTime,
      isLiveOverride: config.isLiveOverride,
      isHistoricalArchive
    },
    grandWinner,
    seatLeaderboard,
    constituencyWinners,
    candidateChartData,
    filteredCandidates: filteredCandidates.slice(0, 50)
  };
}


module.exports = {
  calculateAnalytics
};
