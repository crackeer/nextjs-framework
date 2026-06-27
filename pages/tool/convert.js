import React from 'react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Base64 } from 'js-base64';
import dayjs from 'dayjs';

class Convert extends React.Component {
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            input: '',
            output: '',
        };
    }
    componentDidMount = async () => {};
    htmlTitle = () => {
        return '转码';
    };

    do = async (tool) => {
        const { input } = this.state;
        let output = '';
        switch (tool) {
            case 'base64_decode':
                output = Base64.decode(input);
                break;
            case 'base64_encode':
                output = Base64.encode(input);
                break;
            case 'urldecode':
                output = encodeURIComponent(input);
                break;
            case 'urlencode':
                output = decodeURIComponent(input);
                break;
            case 'formate_time':
                output = dayjs(this.state.input * 1000).format('YYYY-MM-DD HH:mm:ss');
                break;
            case 'now_timestamp':
                output = '' + dayjs().unix();
                break;
        }
        this.setState({ output: output });
    };
    render() {
        const tools = [
            ['urldecode', 'UrlDecode'],
            ['urlencode', 'UrlEncode'],
            ['base64_decode', 'Base64Decode'],
            ['base64_encode', 'Base64Encode'],
            ['formate_time', '时间戳格式化'],
            ['now_timestamp', '获取当前时间戳'],
        ];
        return (
            <div className="space-y-4">
                <Textarea
                    rows={5}
                    value={this.state.input}
                    onChange={(e) => this.setState({ input: e.target.value })}
                    placeholder="输入"
                />

                <div className="flex flex-wrap gap-2">
                    {tools.map(([key, label]) => (
                        <Button key={key} onClick={() => this.do(key)}>
                            {label}
                        </Button>
                    ))}
                </div>

                <Textarea rows={5} value={this.state.output} readOnly placeholder="输出" />
            </div>
        );
    }
}

export default Convert;
