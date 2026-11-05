import React from 'react'
import axios from 'axios'
import { useQuery } from 'react-query'
import { getManageURL } from '../utils'
import { Loading } from './Loading'
import { EventListContent } from './EventListContent'

export function EventList({ from, to, grants, _limit, en = false }) {
    const filter = { from, to, grants, _limit }
    const { isLoading, error, data } = useQuery(['events', filter], async () => {
        // The two public APIs use different names for the same grant filter.
        const [conferences, seminars] = await Promise.all([
            axios.get(getManageURL('public/conferences'), {
                params: { ...filter, _sort: 'startDate' },
            }),
            axios.get(getManageURL('public/seminars'), {
                params: { from, to, grant: grants, _limit, _sort: 'startDatetime' },
            }),
        ])

        return [
            ...(conferences.data?.data || []).map(event => ({ ...event, type: 'conference' })),
            ...(seminars.data?.data || []).map(event => ({ ...event, type: 'seminar' })),
        ].sort((a, b) => new Date(a.startDatetime || a.startDate) - new Date(b.startDatetime || b.startDate))
    })

    if (isLoading || error) return <Loading widget="Lista degli eventi" error={error} />

    return <EventListContent events={data} en={en} />
}
