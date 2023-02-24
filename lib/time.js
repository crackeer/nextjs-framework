import dayjs from 'dayjs';

const formateTPL = 'YYYY-MM-DD HH:mm:ss'

function Unix2Time(ts) {
    return dayjs.unix(ts).format(formateTPL)
}


function FormatTime(time) {
    return dayjs(time).format(formateTPL)
}

function TodayDate() {
    return dayjs().format('YYYY-MM-DD')
}

function NowTs() {
    return dayjs().unix()
}

export default {
    FormatTime, Unix2Time, TodayDate, NowTs,
}

