import { useEffect, useState, useCallback } from 'react';
import { isServer } from '@aomao/engine';
import Editor, { Content } from '../../amd/editor';
import Space from 'antd/es/space';
import Button from 'antd/es/button';
import 'antd/es/space/style';
import 'antd/es/button/style';
import './editor.less';

export default () => {
	const [engine, setEngine] = useState<EngineInterface | null>(null);
	const doc = ""

	useEffect(() => {
		if (!!doc.value) return;

		
	}, [doc]);

	const onSave = (content) => {
		
	};

	return (
        <Editor
            lang={lang}
            placeholder="这里是编辑区域哦~"
            defaultValue={doc}
            comment={true}
            readonly={isReadonly}
            onLoad={setEngine}
            onSave={onSave}
        />
	);
};
