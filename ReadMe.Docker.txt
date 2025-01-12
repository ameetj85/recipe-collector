docker build -t recipe-collector .
Alternate build for Linux container:
>docker build . --platform linux/amd64 -t recipe-collector

docker run --env-file .env -p 9000:9000 -d recipe-collector

Push to github packages repo:
In Github --> Settings --> Developer Settings --> Pesonal Access Tokens --> Tokens (classic)
Generate new token (classic)
MFA auth reqd
For scopes: select write:packages, read:packages, delete:packages
Scroll to bottom and click generate tokenCopy generated token value
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 for this project

Log Docker into Github to upload image: docker login ghcr.io -u ameetj85
For password pass in the token from above

You will need to re-build the docker image to mcomply with github pkg repo requirements:
>docker build . --platform linux/amd64 -t ghcr.io/ameetj85/recipe-collector

Push image to github pkg registry
>docker push ghcr.io/ameetj85/recipe-collector

When successful you will see your package in the githu7b pkg registry page

*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
Push to Hivelocity VPS -
*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
From the command line log into ssh shell of VPS instance - 
ssh root@23.92.78.126 -p 22
Enter password

Update all packages on VPS - 
>apt-get update

Check if docker exists on VPS - 
>docker -v

If Docker does not exist then install it - 
>apt-get install docker.io

Run >docker -v to verify
System Ctl command should return active if Docker is running on VPS
>systemctl is-active docker
If the result is not active then start Docker.
>systemctl start docker

Test that Docker can run a generic image\
>docker run hello-world

Verify that hello-world is available in VPS
>docker images
REPOSITORY    TAG       IMAGE ID       CREATED         SIZE
hello-world   latest    d2c94e258dcb   20 months ago   13.3kB

Log into ghcr.io from VPS - 

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 for this project
>docker login ghcr.io -u ameetj85
For password pass in the token from above

Once logged int oDocker run the image - 
>docker run -p 9000:9000 --env-file ./.env ghcr.io/ameetj85/recipe-collector:latest

NOTE: To trasfer .env file to VPS follow this document - 
    https://www.inmotionhosting.com/support/website/ftp/connecting-scp-sftp/
Use Filezilla

Create DNS records using your own domain in Hivelocity - 
    https://www.hivelocity.net/kb/how-to-create-dns-records-in-myvelocity/

Vercel url: recipe-collector-tau.vercel.app
