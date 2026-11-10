import React from 'react'
import axios from 'axios'
import { useQuery } from 'react-query'
import { getManageURL, isEnglish } from '../utils'
import { Loading } from './Loading'
import { EventListContent } from './EventListContent'
import { YearGroupedContent } from './YearGroupedContent'

export function ConferenceList({ from, to, grants, ssd, is_outreach, _sort, _limit, en = false, group_by_year = false }) {
    const filter = { from, to, grants, ssd, is_outreach, _sort, _limit }
    const { isLoading, error, data } = useQuery(['conferences', filter], async () => {
        const response = await axios.get(getManageURL('public/conferences'), { params: filter })
        return response.data?.data || []
    })

    if (isLoading || error) return <Loading widget="Lista delle conferenze" error={error} />

    return <YearGroupedContent data={data} grouped={group_by_year} dateField="startDate" en={isEnglish(en)}>
        {events => <EventListContent events={events} type="conference" en={en} />}
    </YearGroupedContent>
}
