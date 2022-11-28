import ModelPage from './ModelPage'

export default function VisitPage() {
    return <ModelPage 
        ModelName = 'Visit' 
        objCode = 'visit'
        objName = 'visita'
        indexUrl = '/visits'
        oa = 'a'
        describe = {obj => `${obj?.person?.lastName}`}
        onChange = {setObj => (field, value) => {
            if (field === 'person') {
                setObj(obj => ({...obj, affiliation: value ? value.affiliation : ""}))
            }}}   
        />
}
