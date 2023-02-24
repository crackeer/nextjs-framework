import axios from 'axios'
import { always_header } from './const'

function getAxiosConfig(method, fullUrl, data, header) {
	let allHeader = always_header(header)

	let config = {
		url: fullUrl,
		method: method,
		params: null,
		data: null,
		withCredentials: false,
		headers: allHeader,
	}
	if (method.toLocaleUpperCase() == "POST") {
		config.data = data
	}
	if (method.toLocaleUpperCase() == "GET" || method.toLocaleUpperCase() == "PUT" || method.toLocaleUpperCase() == "DELETE") {
		config.params = data
	}
	return config
}

export const req = async (method, url, params, header) => {
	try {
		if (header == null || header == undefined) {
			header = {}
		}
		let axiosConfig = getAxiosConfig(method, url, params, header)
		let res = await axios(axiosConfig)
		return res.data
	} catch (e) {
		return {
			data: null
		}
	}
}

export const get = async (url, params) => {
	return req("GET", url, params)
};
export const post = async (url, params) => {
	return req("POST", url, params)
};

export const del = async (url, params) => {
	return req("DELETE", url, params)
};

export const put = async (url, params) => {
	return req("PUT", url, params)
};