import { useEffect, useState } from 'react';
import Switch from '@mui/material/Switch';

import { Filter, TzevaAdom } from '../models/models';
import { utilService } from '../services/util.service';

import { BrushBarChart } from './Charts/BrushBarChart';
import { t } from 'i18next';

interface props {
    allTzevaAdom: TzevaAdom[]
    filterBy: Filter
}

export function TzevaAdomChart({ allTzevaAdom, filterBy }: props) {
    const [isByMinute, setIsByMinute] = useState<boolean>(false)
    const [formTzevaAdom, setFormTzevaAdom] = useState<{ date: string, alerts: number }[]>(formData())

    useEffect(() => {
        setFormTzevaAdom(formData())
    }, [allTzevaAdom, isByMinute])



    function formData(): { date: string, alerts: number }[] {
        const dataMap = {}
        const { startDate, endDate } = filterBy

        !isByMinute ?
            utilService.getDateRange(startDate, endDate).forEach(date => {
                if (!dataMap[date]) dataMap[date] = 0
            }) :
            utilService.getMinuteRange().forEach(date => {
                if (!dataMap[date]) dataMap[date] = 0
            })

        allTzevaAdom.forEach(({ alerts }) => {
            const time = alerts[0].time
            const date = !isByMinute ?
                utilService.getFormDate(time * 1000) :
                utilService.getFormMinute(time * 1000)

            if (dataMap[date]) dataMap[date]++
            else dataMap[date] = 1
        })

        const data = []
        for (const key in dataMap) {
            data.push({
                date: key,
                alerts: dataMap[key]
            })
        }

        return data.filter(({ alerts }) => alerts >= filterBy.alertsAmounts)
    }

    function handleChange(ev: React.ChangeEvent<HTMLInputElement>) {
        const { checked } = ev.target;
        setIsByMinute(checked)
    }

    function maxAlertDay(data: { date: string, alerts: number }[]): string {
        let max = { alerts: 0, date: '' }
        data.forEach(({ date, alerts }) => { if (alerts > max.alerts) max = { date, alerts } })
        return `${max.alerts} ${t('at')}  ${max.date}`
    }

    const felAlerts = formTzevaAdom.filter(({ alerts }) => alerts <= 0)

    return (
        <section className='tzeva-adom-chart flex column gap10'>
            <BrushBarChart data={formTzevaAdom} />

            <article className='flex align-center direction-sec'>
                <div className='flex align-center'>
                    <label htmlFor="switch">{t('Date/Hours')}</label>
                    <Switch id="switch" onChange={handleChange} />
                </div>
            </article>

            <article className='statistical'>
                <h3>{t('Total alerts')}: {formTzevaAdom.reduce((sum, { alerts }) => sum + alerts, 0)} </h3>
                {!isByMinute ? <h3>{t('Total days')}: {formTzevaAdom.length} </h3> :
                    <h3>{t('Safest hours between 9AM-9PM')}:{utilService.findSafestHour(formTzevaAdom)}</h3>}
                {!isByMinute ? <h3>{t('Total days without alerts')}: {felAlerts.length} </h3> :
                    <h3>{t('longest period without alerts')}: {utilService.findLongestNoAlertPeriod(formTzevaAdom)}</h3>}
                <h3>{t('Most alerts')}: {maxAlertDay(formTzevaAdom)} </h3>
                <h3>{t('Average time between alerts')}: {utilService.checkAveBreak(allTzevaAdom, filterBy.startDate, filterBy.endDate)} </h3>


                {/* <h3>Total {isByMinute ? 'minutes' : 'days'}: {formTzevaAdom.length} {isByMinute ? '(24h)' : ''} </h3>
                <h3>Total {isByMinute ? 'minutes' : 'days'} without alerts: {felAlerts.length} {isByMinute ? `(${getHoursMinutes(felAlerts.length)})` : ''} </h3> */}
            </article>
        </section>
    )
}