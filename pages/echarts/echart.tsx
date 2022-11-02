import React from 'react';
import { Button, message, Input } from 'antd';
import { Select, Row, Col } from 'antd';
import Table from '../../component/Table'
const { Option } = Select;
// 引入 ECharts 主模块
import * as echarts from 'echarts';// 引入柱状图

class Echart extends React.Component<any, any> {
    chart: any
    constructor(props: any) {
        super(props); // 用于父子组件传值
        this.state = {
            input: '',
            list: [],

            title : '',

            fields: [],
            xk: '',
            yk: '',
            groupk: '',

            lineData: {}
        }
    }
    componentDidMount = async () => {
        this.chart = echarts.init(document.getElementById('main'));
    }
    generate = async () => {

        let xAxis = []
        let xAxisMap = {}

        this.state.list.forEach(item => {
            if (xAxisMap[item[this.state.xk]] == undefined) {
                xAxisMap[item[this.state.xk]] = true
                xAxis.push(item[this.state.xk])
            }
        });
        xAxis.sort()
        let tmpSeries = []

        if (this.state.groupk.length > 0) {
            let groupList = {}
            this.state.list.forEach(item => {
                if (groupList[item[this.state.groupk]] == undefined) {
                    groupList[item[this.state.groupk]] = {}
                }
                groupList[item[this.state.groupk]][item[this.state.xk]] = item[this.state.yk]
            })

            let groups = Object.keys(groupList)
            groups.forEach(g => {
                let tmpL = []

                xAxis.forEach(x => {
                    tmpL.push(groupList[g][x])
                })

                tmpSeries.push({
                    name: g,
                    type: 'line',
                    data: tmpL
                })
            })
        }

        let lines = Object.keys(this.state.lineData)

        // 基于准备好的dom，初始化echarts实例

        // 绘制图表
        this.chart.setOption({
            title: {
                text: 'icon实验 - icon点击量趋势'
            },
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: lines,
            },
            xAxis: {
                data: xAxis,
                type: 'category',
                boundaryGap: false,
            },
            yAxis: {
                type: 'value'
            },
            series: tmpSeries,
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
        });
    }

    decodeJSON = async () => {
        try {
            let list = JSON.parse(this.state.input)
            if (list.length == undefined) {
                message.error('数据不是list')
                return
            }
            await this.setState({
                list: list
            })
            if (list.length > 0) {
                this.setState({
                    fields: Object.keys(list[0])
                })
            }
        } catch (e) {
            message.error(e)
        }
    }
    render() {
        return (
            <div>
                <h3><strong>步骤一：输入原始JSON数据</strong></h3>
                <Row gutter={20}>
                    <Col span={21}>
                        <Input.TextArea rows={4} onChange={(e) => {
                            this.setState({
                                input: e.target.value
                            })
                        }}></Input.TextArea>
                    </Col>
                    <Col span={3}>
                        <Button type="primary" onClick={this.decodeJSON}>解析JSON数据</Button>
                    </Col>
                </Row>
                <div style={{ display: this.state.list.length > 0 ? '' : 'none', marginTop:'30px'}}>
                    <h3><strong>步骤二：选择横坐标字段、纵坐标字段和分组字段</strong></h3>
                    <Row gutter={20} style={{marginBottom:'20px'}}>
                        <Col span={7}>
                            横坐标：
                                <Select style={{ width: '100%' }} onChange={(val) => {
                                    this.setState({
                                        xk: val
                                    })
                                }}>
                                    {this.state.fields.map(k => (
                                        <Option key={k} value={k}>{k}</Option>
                                    ))}
                                </Select>
                            
                        </Col>
                        <Col span={7}>
                            纵坐标：
                                <Select style={{ width: '100%' }} onChange={(val) => {
                                    this.setState({
                                        yk: val
                                    })
                                }}>
                                    {this.state.fields.map(k => (
                                        <Option key={k} value={k}>{k}</Option>
                                    ))}
                                </Select>
                            
                        </Col>
                        <Col span={7}>
                            分组字段
                                <Select style={{ width: '100%' }} onChange={(val) => {
                                    this.setState({
                                        groupk: val
                                    })
                                }}>
                                    {this.state.fields.map(k => (
                                        <Option key={k} value={k}>{k}</Option>
                                    ))}
                                </Select>
                            
                        </Col>
                        <Col span={3}>
                            点我生成
                            <div><Button onClick={this.generate} type="primary" size="small">Generate</Button></div>
                        </Col>
                    </Row>
                    <Table list={this.state.list} scroll={{ y: '300px' }}></Table>
                </div>

                <div id="main" style={{ height: 600 }}></div>

            </div>

        );
    }
}

export default Echart;
