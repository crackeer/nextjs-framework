import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import PageHeader from '../../../../components/PageHeader';

export default function Page() {
    return (
        <PageHeader title="Markdown编辑">
            <>
                <h1 className="text-2xl font-bold mb-4">Hello World</h1>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Markdown的那些</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p>
                            <a
                                className="text-primary underline"
                                href="https://github.com/bytedance/bytemd"
                                target="_blank"
                                rel="noreferrer"
                            >
                                https://github.com/bytedance/bytemd
                            </a>
                        </p>
                        <p>
                            <a
                                className="text-primary underline"
                                href="https://pandao.github.io/editor.md/"
                                target="_blank"
                                rel="noreferrer"
                            >
                                https://pandao.github.io/editor.md/
                            </a>
                        </p>
                    </CardContent>
                </Card>
            </>
        </PageHeader>
    );
}
