# EC2 Instance Start/Stop

A [Serverless Application](https://github.com/awslabs/serverless-application-model)
that starts and stops your [EC2](https://aws.amazon.com/ec2/) instance with the
help of [tags](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Using_Tags.html)
, cron expressions and [AWS Lambda](https://aws.amazon.com/lambda/). 

## Usage

You tag your instances with when you whant them stared or stoped. This function 
then runs every few minutes *(default is 15)* and looks for instances with 
those instruction tags (default `Scheduled_Start` and `Scheduled_Stop`). For 
any tag it finds the cron expression gets parsed and checked if it maches any 
time since the last run of the function. If that is the case the instance gets 
started or respectively stoped.

As the function only runs every few minutes it is unlikely that your instance 
gets startet exactly on the second but rather the next time the function runs.
If nessesary it is possible to influence the delay with the call rate of the 
function.

Time is a difficult thing, even in  world of global systems administration.
Thats why times are **always** in [UTC](https://time.is/UTC)

## Supported cron format

```
*    *    *    *    *    *
┬    ┬    ┬    ┬    ┬    ┬
│    │    │    │    │    |
│    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
│    │    │    │    └───── month (1 - 12)
│    │    │    └────────── day of month (1 - 31)
│    │    └─────────────── hour (0 - 23)
│    └──────────────────── minute (0 - 59)
└───────────────────────── second (0 - 59, optional)
```

Supports mixed use of ranges and range increments (L, W and # characters are 
not supported currently). If you prefer a more a visual approach have a look 
at [crontab-generator](https://crontab-generator.org/). Or just go with the 
the usual suspects:
* Start `0 0 7 * * 1-5` and stop `0 0 19 * * 1-5` so the instance runs monday 
  to friday 7 to 18 o'clock.
* Start `0 0 6 * * 1` the instance monday morning at 6 and run until friday
  at 20 o'clock `0 0 21 * * 5`.

**Don't forget we are still in [UTC](https://time.is/UTC)**

## Set me up

[sam](https://github.com/awslabs/aws-sam-local) is the AWS CLI tool for 
managing Serverless applications. With sam's help we package the code as a zip 
artifact, upload it to S3 and deploy it to Lambda using AWS CloudFormation.

```
$ npm install -g aws-sam-local
$ npm install --production
$ sam package --template-file template.yaml --s3-bucket some-bucket --output-template-file packaged.yaml
$ sam deploy --template-file ./packaged.yaml --stack-name ec2startstop --capabilities CAPABILITY_IAM
```

If want to stick to the basics you can archive the same with the commands 
`aws cloudformation package` and `aws cloudformation deploy`.

## Timezone

You are able to set the TIMEZONE via the aws lambda Enviornment. The Timezone is implemented with the help of [Moment Timezon](https://momentjs.com/timezone/) 

## Contributing

Pull requests are always welcome. I'm grateful for any help or inspiration.

## License and Authors

Author: Jan Sauer
<[jan@jansauer.de](mailto:jan@jansauer.de)>
([https://jansauer.de](https://jansauer.de))

```text
Copyright 2018, Jan Sauer <jan@jansauer.de> (https://jansauer.de)

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
