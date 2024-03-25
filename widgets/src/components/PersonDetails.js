import React from 'react';
import { getManageURL, getSSDLink } from '../utils';
import axios from 'axios'
import { Loading } from './Loading'

import Markdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

import { formatDateInterval } from '../utils'
import { useQuery } from 'react-query'

export function PersonDetails({ id }) {
    const { isLoading, error, data } = useQuery([ 'person', id ], async () => {
        if (id !== null) {
            const res = await axios.get(getManageURL('public/person/' + id))
            const person = res.data.data[0]
            if (! person) {
                throw new Error("Impossibile trovare la persona richiesta")
            }

            return person
        }
        else {
            throw new Error('Impossibile trovare la persona richiesta')
        }
    })

    if (isLoading || error ) {
        return <Loading widget="Scheda personale" error={error}></Loading>
    }

    if (! data) {
        return <div>
            404 Not Found.
        </div>
    }

    return <div>
        Scheda personale {JSON.stringify(data)}
    </div>
}
