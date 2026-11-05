import React from 'react'
import axios from 'axios'
import { useQuery } from 'react-query'
import { getManageURL } from '../utils'
import { Loading } from './Loading'
import { EventListContent } from './EventListContent'

export function ConferenceList({ from, to, grants, ssd, is_outreach, _sort, _limit, en = false }) {
    const filter = { from, to, grants, ssd, is_outreach, _sort, _limit }
    const { isLoading, error, data } = useQuery(['conferences', filter], async () => {
        const response = await axios.get(getManageURL('public/conferences'), { params: filter })
        return response.data?.data || []
    })

    if (isLoading || error) return <Loading widget="Lista delle conferenze" error={error} />

    return <EventListContent events={data} type="conference" en={en} />
}
