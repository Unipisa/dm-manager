import React from 'react'
import axios from 'axios'
import { useQuery } from 'react-query'
import { getManageURL, isEnglish } from '../utils'
import { Loading } from './Loading'
import { EventListContent } from './EventListContent'
import { YearGroupedContent } from './YearGroupedContent'

export function SeminarList({ from, to, category, grants, _sort, _limit, en = false, group_by_year = false }) {
    const filter = { from, to, category, grants, _sort, _limit }
    const { isLoading, error, data } = useQuery(['seminars', filter], async () => {
        const response = await axios.get(getManageURL('public/seminars'), { params: filter })
        return response.data?.data || []
    })

    if (isLoading || error) return <Loading widget="Lista dei seminari" error={error} />

    return <YearGroupedContent data={data} grouped={group_by_year} dateField="startDatetime" en={isEnglish(en)}>
        {events => <EventListContent events={events} type="seminar" en={en} />}
    </YearGroupedContent>
}
