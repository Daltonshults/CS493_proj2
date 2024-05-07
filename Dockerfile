FROM node:16
WORKDIR /usr/src/app
COPY . .
RUN npm install
ENV PORT=8000
ENV MYSQL_HOST=mysql-server
EXPOSE ${PORT}
CMD [ "npm", "start" ]
