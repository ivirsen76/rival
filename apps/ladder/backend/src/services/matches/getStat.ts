import dayjs from '../../utils/dayjs';

export type Point = {
    pid: number;
    did_host_win_point: true;
    num_of_serves: number;
    server: string;
    server_court_side: null;
    was_break_point: boolean;
    prev_host_points: number;
    prev_guest_points: number;
    detail: string;
    started_at: string;
    ended_at: string;
    timestamp: string;
    trimmed_started_at: null;
    trimmed_ended_at: null;
    updated_at: string;
    game_id: number;
    set_id: number;
    rally_length: number;
    was_set_point_for_host: boolean;
    was_set_point_for_guest: boolean;
    was_net_point_for_host: boolean;
    was_net_point_for_guest: boolean;
    returner: string;
    detail_player: string;
    is_favorited: boolean;
    in_highlight_reel: boolean;
    is_rally: boolean;
    was_challenged: boolean;
    host_distance_run: number;
    host_partner_distance_run: number;
    guest_distance_run: number;
    guest_partner_distance_run: number;
    start_trim: number;
    end_trim: number;
    autoscore_confidence: null;
    user_edited: boolean;
    user_edited_attributes: [];
};

type UserStat = {
    aces: number;
    backhandForced: number;
    backhandUnforced: number;
    backhandWinners: number;
    breakpointsTotal: number;
    breakpointsWon: number;
    firstServeIn: number;
    firstServeWon: number;
    forehandForced: number;
    forehandUnforced: number;
    forehandWinners: number;
    normal: number;
    secondServeWon: number;
    serveTotal: number;
    serveUnforced: number;
    serveWinners: number;
};

type Stat = {
    timeTotal: number;
    challenger: UserStat;
    acceptor: UserStat;
    imageUrl?: string;
    imageWidth?: number;
    imageHeight?: number;
};

const getStat = (points: Point[], isReversed = false): Stat => {
    const matchTypes: Record<string, { key: string; player: 'winner' | 'looser' }> = {
        forehand_forced_error: { key: 'forehandForced', player: 'looser' },
        forehand_unforced_error: { key: 'forehandUnforced', player: 'looser' },
        forehand_winner: { key: 'forehandWinners', player: 'winner' },
        backhand_forced_error: { key: 'backhandForced', player: 'looser' },
        backhand_unforced_error: { key: 'backhandUnforced', player: 'looser' },
        backhand_winner: { key: 'backhandWinners', player: 'winner' },
        double_fault: { key: 'serveUnforced', player: 'looser' },
        service_winner: { key: 'serveWinners', player: 'winner' },
        ace: { key: 'aces', player: 'winner' },
        normal: { key: 'normal', player: 'winner' },
    };

    const result: Stat = {
        timeTotal: 0,
        challenger: {
            aces: 0,
            backhandForced: 0,
            backhandUnforced: 0,
            backhandWinners: 0,
            breakpointsTotal: 0,
            breakpointsWon: 0,
            firstServeIn: 0,
            firstServeWon: 0,
            forehandForced: 0,
            forehandUnforced: 0,
            forehandWinners: 0,
            normal: 0,
            secondServeWon: 0,
            serveTotal: 0,
            serveUnforced: 0,
            serveWinners: 0,
        },
        acceptor: {
            aces: 0,
            backhandForced: 0,
            backhandUnforced: 0,
            backhandWinners: 0,
            breakpointsTotal: 0,
            breakpointsWon: 0,
            firstServeIn: 0,
            firstServeWon: 0,
            forehandForced: 0,
            forehandUnforced: 0,
            forehandWinners: 0,
            normal: 0,
            secondServeWon: 0,
            serveTotal: 0,
            serveUnforced: 0,
            serveWinners: 0,
        },
    };

    const startTime = dayjs(points[0].started_at);
    const endTime = dayjs(points[points.length - 1].ended_at);
    result.timeTotal = endTime.diff(startTime, 'minute');

    for (const point of points) {
        const players: Record<string, 'challenger' | 'acceptor'> = {
            server: point.server === 'host' ? 'challenger' : 'acceptor',
            returner: point.server === 'host' ? 'acceptor' : 'challenger',
            winner: point.did_host_win_point ? 'challenger' : 'acceptor',
            looser: point.did_host_win_point ? 'acceptor' : 'challenger',
        };
        const { server, returner, winner } = players;

        const type = matchTypes[point.detail];
        if (!type) {
            throw new Error(`Unknown type "${point.detail}"`);
        }
        // @ts-expect-error - I don't know how to define type
        result[players[type.player]][type.key]++;

        result[server].serveTotal++;
        if (point.num_of_serves === 1) {
            result[server].firstServeIn++;
            if (server === winner) {
                result[server].firstServeWon++;
            }
        }
        if (point.num_of_serves === 2 && server === winner) {
            result[server].secondServeWon++;
        }

        if (point.was_break_point) {
            result[returner].breakpointsTotal++;

            if (returner === winner) {
                result[returner].breakpointsWon++;
            }
        }
    }

    if (isReversed) {
        const temp = result.challenger;
        result.challenger = result.acceptor;
        result.acceptor = temp;
    }

    return result;
};

export default getStat;
