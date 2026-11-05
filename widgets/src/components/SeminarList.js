import React from 'react'
import axios from 'axios'
import { useQuery } from 'react-query'
import { getManageURL } from '../utils'
import { Loading } from './Loading'
import { EventListContent } from './EventListContent'

export function SeminarList({ from, to, category, grant, _sort, _limit, en = false }) {
    const filter = { from, to, category, grant, _sort, _limit }
    const { isLoading, error, data } = useQuery(['seminars', filter], async () => {
        const response = await axios.get(getManageURL('public/seminars'), { params: filter })
        return response.data?.data || []
    })

    if (isLoading || error) return <Loading widget="Lista dei seminari" error={error} />

    return <EventListContent events={data} type="seminar" en={en} />
}
