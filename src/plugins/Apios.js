import Axios from 'axios'
import store from '@/store/'

const CancelToken = Axios.CancelToken
const source = CancelToken.source()
const pendingCalls = {}

const apiosConfig = {
    baseURL: process.env.VUE_APP_API_URL + '/' + process.env.VUE_APP_API_VERSION + '/c/',
    withCredentials: true,
    cancelToken: source.token
}

const apios = Axios.create(apiosConfig)

apios.interceptors.request.use(config => {
    if (pendingCalls[config.baseURL + config.url] === true) {
        return {
            ...config, cancelToken: new CancelToken((cancel) => cancel(config.url))
        }
    }
    store.dispatch('loading', true)
    pendingCalls[config.baseURL + config.url] = true
    return config
}, err => {
    return Promise.reject(err)
})

apios.interceptors.response.use(res => {
    store.dispatch('loading', false)
    pendingCalls[res.config.url] = null
    return res.data
}, err => {
    store.dispatch('loading', false)
    if (err.constructor.name === 'Cancel') return Promise.reject(err)
    if (!err.response) return Promise.reject(err)
    pendingCalls[err.response.config.url] = null
    if (!err.response.data) return Promise.reject(Error('noData'))
    if (!err.response.data.condition) return Promise.reject(Error('noCondition'))
    return Promise.reject(err.response.data.condition)
})

export default apios
