/*
 *  Power BI Visualizations
 *  
 *  HTML5 MP3 Audio Narration
 *
 *  Copyright (c) David Eldersveld, BlueGranite Inc.
 *  All rights reserved. 
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *   
 *  The above copyright notice and this permission notice shall be included in 
 *  all copies or substantial portions of the Software.
 *   
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 *
 */

module powerbi.visuals {
    export class MP3AudioNarration implements IVisual {
        public static capabilities: VisualCapabilities = {
            dataRoles: [
                {
                    name: 'Category',
                    kind: powerbi.VisualDataRoleKind.Grouping,
                    displayName: 'MP3 Audio URL'
                },
            ],
            dataViewMappings: [{
                categories: {
                    for: { in: 'Category' },
                    dataReductionAlgorithm: { top: {} }
                },
            }],
            objects: {
                general: {
                    displayName: data.createDisplayNameGetter('Visual_General'),
                    properties: {
                        formatString: {
                            type: { formatting: { formatString: true } },
                        },
                        //mp3File: {
                        //    type: { text: true },
                        //    displayName: 'MP3 URL'
                        //},
                    },
                }
            },
        };

        //private dataView: DataView;

        public static converter(dataView: DataView): any {

            var audioFileValue = null;
            if (!dataView.table.rows[1]) {
                audioFileValue = 'http://fightmusic.com/mp3/big10/Michigan__Hail_To_The_Victors.mp3';
            }
            else {
                audioFileValue = dataView.table.rows[1];
            }

            return audioFileValue;
        }

        public init(options: VisualInitOptions): void {

            d3.select(options.element.get(0)).append("audio");

        }

        public update(options: VisualUpdateOptions) {

            var audioSource = MP3AudioNarration.converter(options.dataViews[0]);
            //var audioSource = MP3Player.getFile(this.dataView);

            var audio = d3.select("audio");
            audio.attr('src', audioSource);
            audio.attr('id', 'htmlAudio');
            audio.attr('type', 'audio/mpeg');
            //audio.attr('autoplay', 'true');
            audio.attr('loop', 'true');
            audio.attr('controls', 'true');
        }

        //private getFile(dataView: DataView): string {
        //    if (dataView) {
        //        var objects = dataView.metadata.objects;
        //        if (objects) {
        //            var general = objects['general'];
        //            if (general) {
        //                var mp3Source = <string>general['mp3Source'];
        //                if (mp3Source)
        //                    return mp3Source;
        //            }
        //        }
        //    }
        //    return 'http://fightmusic.com/mp3/big10/Michigan__Hail_To_The_Victors.mp3';
        //}

        //public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
        //    var instances: VisualObjectInstance[] = [];
        //    switch (options.objectName) {
        //        case 'general':
        //            var general: VisualObjectInstance = {
        //                objectName: 'general',
        //                displayName: 'General',
        //                selector: null,
        //                properties: {
        //                    mp3File: this.getFile(this.dataView)
        //                }
        //            };
        //            instances.push(general);
        //            break;
        //    }

        //    return instances;
        //}
    }
}

module powerbi.visuals.plugins {
    export var _mp3AudioNarration: IVisualPlugin = {
        name: '_mp3AudioNarration',
        class: '_MP3AudioNarration',
        capabilities: MP3AudioNarration.capabilities,
        create: () => new MP3AudioNarration()
    };
}